<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" }], ["circle", { "cx": "12", "cy": "12", "r": "3" }]];
</script>

<Icon name="eye" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
