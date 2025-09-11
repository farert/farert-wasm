<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "m7 7 10 10-5 5V2l5 5L7 17" }]];
</script>

<Icon name="bluetooth" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
