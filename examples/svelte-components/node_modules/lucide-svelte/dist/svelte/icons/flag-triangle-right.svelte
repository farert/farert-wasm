<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "M7 22V2l10 5-10 5" }]];
</script>

<Icon name="flag-triangle-right" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
